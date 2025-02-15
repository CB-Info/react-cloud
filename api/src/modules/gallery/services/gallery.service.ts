import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GalleryRepository } from '../repositories/gallery.repository';
import { GalleryDTO } from '../dto/gallery.dto';
import { Gallery } from '../models/gallery.model';
import { User } from '../../user/models/user.model';
import { CloudStorageService } from 'src/common/services/cloud-storage.service';
import { VisionApiService } from 'src/common/services/vision-api.service';
import { Types } from 'mongoose';

@Injectable()
export class GalleryService {
  constructor(
    private readonly galleryRepository: GalleryRepository,
    private readonly cloudStorageService: CloudStorageService,
    private readonly visionApiService: VisionApiService,
  ) {}

  async createGallery(parameters: GalleryDTO, userId: string) {
    try {
      const { title, image } = parameters;

      const visionResult = await this.visionApiService.analyzeImage(image);

      if (this.isImageInappropriate(visionResult)) {
        const fileName = this.extractFileNameFromUrl(image);
        if (fileName) await this.cloudStorageService.deleteFile(fileName);

        throw new BadRequestException(
          'L’image contient du contenu interdit et a été supprimée.',
        );
      }

      const newGallery = (await this.galleryRepository.insert({
        title: title,
        image: image,
        owner: new Types.ObjectId(userId),
      })) as Gallery;

      return await this.galleryRepository.findOneById(newGallery._id);
    } catch {
      throw new BadRequestException();
    }
  }

  async getAllGalleries() {
    try {
      return await this.galleryRepository.findAll();
    } catch {
      throw new BadRequestException();
    }
  }

  async likeGallery(galleryId: string, userId: string): Promise<boolean> {
    const gallery = await this.galleryRepository.findOneById(galleryId);
    if (!gallery) throw new NotFoundException('Gallery not found');

    if (!gallery.likes.includes(userId as any)) {
      return this.galleryRepository.updateOneBy({ _id: galleryId }, {
        likes: [...gallery.likes, userId],
      } as Partial<Gallery>);
    }

    return null;
  }

  async unlikeGallery(galleryId: string, userId: string): Promise<boolean> {
    const gallery = await this.galleryRepository.findOneById(galleryId);
    if (!gallery) throw new NotFoundException('Gallery not found');

    // Vérification pour éviter les erreurs
    const likes = Array.isArray(gallery.likes) ? gallery.likes : [];

    const updatedLikes = likes.filter((id) => id?.toString() !== userId);

    if (updatedLikes.length !== likes.length) {
      return this.galleryRepository.updateOneBy({ _id: galleryId }, {
        likes: updatedLikes,
      } as Partial<Gallery>);
    }

    return null;
  }

  async deleteGallery(galleryId: string, userId: string): Promise<boolean> {
    const gallery = await this.galleryRepository.findOneById(galleryId);
    if (!gallery) {
      return false;
    }

    if (!gallery.owner.equals(new Types.ObjectId(userId))) {
      throw new UnauthorizedException(
        'You are not allowed to delete this image.',
      );
    }

    const deleteSuccess = await this.galleryRepository.deleteOneBy({
      _id: galleryId,
    });
    if (!deleteSuccess) {
      return false;
    }

    const fileName = this.extractFileNameFromUrl(gallery.image);
    if (fileName) {
      await this.cloudStorageService.deleteFile(fileName);
    }

    return true;
  }

  private extractFileNameFromUrl(url: string): string | null {
    try {
      const urlObject = new URL(url);
      let pathname = urlObject.pathname;

      pathname = decodeURIComponent(pathname);

      const parts = pathname.split('/');
      if (parts.length < 3) return null;

      return parts.slice(2).join('/'); // Exclut "cloud-pct/" pour garder "images/nom-du-fichier.ext"
    } catch (error) {
      console.error("Erreur lors de l'extraction du nom de fichier:", error);
      return null;
    }
  }

  private isImageInappropriate(visionResult: any): boolean {
    const { safeSearch, labels } = visionResult;

    const isUnsafe =
      safeSearch.adult === 'LIKELY' ||
      safeSearch.adult === 'VERY_LIKELY' ||
      safeSearch.violence === 'LIKELY' ||
      safeSearch.violence === 'VERY_LIKELY' ||
      safeSearch.racy === 'LIKELY' ||
      safeSearch.racy === 'VERY_LIKELY';

    // 🐱 Vérifie si l'image contient un chat
    const containsCat = labels.some((label: string) =>
      ['cat', 'feline', 'kitten'].includes(label.toLowerCase()),
    );

    if (containsCat) {
      console.warn('Image refusée car elle contient un chat !');
    }

    return isUnsafe || containsCat;
  }

  async getUserGalleries(userId: string) {
    return await this.galleryRepository.findManyBy({
      owner: new Types.ObjectId(userId),
    });
  }

  async generateSignedUrl(fileName: string) {
    return this.cloudStorageService.generateUploadSignedUrl(fileName);
  }
}
