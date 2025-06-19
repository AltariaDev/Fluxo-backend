import { PartialType } from '@nestjs/swagger';
import { CreatePomodoroDto } from './create-pomodoro.dto';

export class UpdatePomodoroDto extends PartialType(CreatePomodoroDto) {}
