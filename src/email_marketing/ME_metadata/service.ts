import { 
  Injectable, 
  NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ME_metadata, MEMetadataDocument } from './schema';
import { IMEMetadata } from './interface';
import { UserDocument } from '../../schema';

@Injectable()
export class MEMetadataService {
  constructor(
    @InjectModel(ME_metadata.name) 
    private readonly metadataModel: Model<MEMetadataDocument>,
  ) {}

  async getParameter(parameter: string, user: UserDocument): Promise<any> {
    const metadata = await this.metadataModel.findOne({ creator: user._id });
    
    if (!metadata) {
      return null;
    }

    return metadata[parameter] || null;
  }

  async updateParameter(
    parameter: string, 
    value: any, 
    user: UserDocument,
    merge: boolean = true
  ): Promise<IMEMetadata> {
    let metadata = await this.metadataModel.findOne({ creator: user._id });
    
    if (!metadata) {
      // Create if doesn't exist
      metadata = await this.metadataModel.create({
        creator: user._id
      });
    }

    // Handle deletion (empty value)
    if (value === null || value === undefined || 
        (typeof value === 'object' && Object.keys(value).length === 0)) {
      metadata[parameter] = undefined;
    } else {
      // Update the specific parameter
      if (merge && typeof value === 'object' && metadata[parameter]) {
        // Merge with existing data
        metadata[parameter] = {
          ...metadata[parameter],
          ...value
        };
      } else {
        // Replace entirely
        metadata[parameter] = value;
      }
    }

    await metadata.save();
    return this.toInterface(metadata);
  }

  private toInterface(doc: MEMetadataDocument): IMEMetadata {
    const obj = doc.toObject();
    
    // Remove internal fields
    delete obj._id;
    delete obj.creator;
    delete obj.createdAt;
    delete obj.updatedAt;
    delete obj.__v;
    
    return obj;
  }
}