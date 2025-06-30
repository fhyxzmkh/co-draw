import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UpdatePermissionDto } from '../permissions/dto/update-permission.dto';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger('Documents');

  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(createDocumentDto);
  }

  // 返回所有我创建或者我参与的文档
  @Get('/my')
  findMyAll(@Query('userId') userId: string) {
    return this.documentsService.findMyAll(userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete()
  remove(@Query('userId') userId: string, @Query('fileId') fileId: string) {
    return this.documentsService.remove(userId, fileId);
  }

  // 返回我的协作身份
  @Get('/role')
  findMyRole(
    @Query('userId') userId: string,
    @Query('documentId') documentId: string,
  ) {
    this.logger.log('debug');
    this.logger.log(userId);
    this.logger.log(documentId);

    return this.documentsService.findMyRole(userId, documentId);
  }

  // 返回白板的所有参与者
  @Get('/participants')
  findAllParticipants(@Query('documentId') documentId: string) {
    return this.documentsService.findAllParticipants(documentId);
  }

  @Post('/role/update')
  updateRole(@Body() data: UpdatePermissionDto) {
    return this.documentsService.updateRole(data);
  }

  @Post('/role/delete')
  deleteRole(@Body() data: UpdatePermissionDto) {
    return this.documentsService.deleteRole(data);
  }
}
