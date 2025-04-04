import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Custom decorator to extract the user from the request or a specific property of the user
 */
export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // If no data provided, return the entire user object
    if (!data) {
      return request.user;
    }

    // If data provided, return the specific property of the user object
    return request.user[data];
  }
);
