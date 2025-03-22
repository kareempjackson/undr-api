import { Module, Global } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard';
import { Reflector } from '@nestjs/core';

@Global()
@Module({
  providers: [
    {
      provide: RolesGuard,
      useFactory: (reflector: Reflector) => new RolesGuard(reflector),
      inject: [Reflector],
    },
  ],
  exports: [RolesGuard],
})
export class CommonModule {} 