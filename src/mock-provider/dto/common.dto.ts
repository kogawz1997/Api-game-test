import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class ProviderQueryDto { @IsOptional() @IsString() providerCode?: string; @IsOptional() @IsString() status?: string; }
export class GameQueryDto { @IsOptional() @IsString() providerCode?: string; @IsOptional() @IsString() category?: string; @IsOptional() @IsString() q?: string; @IsOptional() @IsString() status?: string; }
export class BalanceQueryDto { [key: string]: unknown; @IsString() @IsNotEmpty() memberId!: string; @IsString() @IsNotEmpty() providerCode!: string; }
export class TransactionsQueryDto { @IsOptional() @IsString() memberId?: string; @IsOptional() @IsString() providerCode?: string; @IsOptional() @IsString() type?: string; @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number; }
export class LaunchGameDto { [key: string]: unknown; @IsString() @IsNotEmpty() memberId!: string; @IsString() @IsNotEmpty() providerCode!: string; @IsString() @IsNotEmpty() gameCode!: string; }
export class MoneyActionDto { [key: string]: unknown; @IsString() @IsNotEmpty() memberId!: string; @IsString() @IsNotEmpty() providerCode!: string; @IsOptional() @IsString() gameCode?: string; @Type(() => Number) @IsNumber() @IsPositive() amount!: number; @IsString() @IsNotEmpty() referenceId!: string; }
export class SimulateResultDto { @IsString() @IsNotEmpty() memberId!: string; @IsString() @IsNotEmpty() providerCode!: string; @IsString() @IsNotEmpty() gameCode!: string; @Type(() => Number) @IsNumber() @Min(0) betAmount!: number; @Type(() => Number) @IsNumber() @Min(0) winAmount!: number; @IsString() @IsNotEmpty() referenceId!: string; }
