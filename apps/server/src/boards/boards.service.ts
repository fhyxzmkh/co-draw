import { Injectable, Logger } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BoardsService {
  private readonly logger = new Logger('BoardsService');

  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  create(createBoardDto: CreateBoardDto) {
    const newBoard = this.boardRepository.create(createBoardDto);
    return this.boardRepository.save(newBoard);
  }

  findAll() {
    return this.boardRepository.find();
  }

  findOne(id: string) {
    return this.boardRepository.findOneBy({ id });
  }

  update(id: string, updateBoardDto: UpdateBoardDto) {
    return this.boardRepository.update(id, updateBoardDto);
  }

  remove(id: string) {
    return this.boardRepository.delete(id);
  }

  async findMyAll(userId: string) {
    return this.boardRepository
      .createQueryBuilder('board')
      .where('board.owner_id = :userId', { userId })
      .orWhere('board.collaborator_ids ? :userId', { userId })
      .getMany();
  }
}
