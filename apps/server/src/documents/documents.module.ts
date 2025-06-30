import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { ActiveDocsService } from './active-docs.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    PermissionsModule,
    AuthModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, ActiveDocsService],
  exports: [DocumentsService, ActiveDocsService],
})
export class DocumentsModule {}
