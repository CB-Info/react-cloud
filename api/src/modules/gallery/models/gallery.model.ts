import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import DateBeautifier from 'src/common/utils/date.beautifier';

@Schema()
export class Gallery extends Document {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  title: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    default: DateBeautifier.shared.getFullDate(),
  })
  dateOfCreation: string;

  @Prop({ type: String, required: false })
  dateLastModified?: string;
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);

GallerySchema.pre('updateOne', function (next) {
  this.set({ dateLastModified: DateBeautifier.shared.getFullDate() });
  next();
});

GallerySchema.pre('findOneAndUpdate', function (next) {
  this.set({ dateLastModified: DateBeautifier.shared.getFullDate() });
  next();
});
