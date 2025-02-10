import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GalleryRepository } from '../repositories/gallery.repository';
import { GalleryDTO } from '../dto/gallery.dto';
import { Gallery } from '../models/gallery.model';
import { User } from '../../user/models/user.model';
import { CloudStorageService } from 'src/common/services/cloud-storage.service';

@Injectable()
export class GalleryService {
  constructor(
    private readonly galleryRepository: GalleryRepository,
    private readonly cloudStorageService: CloudStorageService,
  ) {}

  async createGallery(parameters: GalleryDTO) {
    try {
      const { title, image } = parameters;

      const publicUrl = await this.cloudStorageService.uploadBase64Image(image);

      const newGallery = (await this.galleryRepository.insert({
        title: title,
        image: publicUrl,
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
}
