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
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Controller('boards')
export class BoardsController {
  private readonly logger = new Logger('BoardsController');

  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(@Body() createBoardDto: CreateBoardDto) {
    return this.boardsService.create(createBoardDto);
  }

  @Get()
  findAll() {
    return this.boardsService.findAll();
  }

  // 返回所有我创建或者我参与的白板
  @Get('/my')
  findMyAll(@Query('userId') userId: string) {
    return this.boardsService.findMyAll(userId);
  }

  // 返回我的协作身份
  @Get('/role')
  findMyRole(
    @Query('userId') userId: string,
    @Query('boardId') boardId: string,
  ) {
    return this.boardsService.findMyRole(userId, boardId);
  }

  // 返回白板的所有参与者
  @Get('/participants')
  findAllParticipants(@Query('boardId') boardId: string) {
    return this.boardsService.findAllParticipants(boardId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardsService.update(id, updateBoardDto);
  }

  @Delete()
  remove(@Query('userId') userId: string, @Query('fileId') fileId: string) {
    return this.boardsService.remove(userId, fileId);
  }
}
