import { NestModule, MiddlewareConsumer } from "@nestjs/common";
export declare class CommonModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void;
}
