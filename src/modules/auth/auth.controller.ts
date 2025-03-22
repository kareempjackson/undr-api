import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, VerifyMagicLinkDto } from "./dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Request a magic link login" })
  @ApiResponse({ status: 200, description: "Magic link sent" })
  async login(@Body() loginDto: LoginDto) {
    await this.authService.sendMagicLink(loginDto.email);
    return { message: "Magic link sent to your email" };
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify a magic link token" })
  @ApiResponse({ status: 200, description: "Token verified successfully" })
  async verifyMagicLink(@Body() verifyDto: VerifyMagicLinkDto) {
    return this.authService.verifyMagicLink(verifyDto.token);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user information" })
  @ApiResponse({ status: 200, description: "User information retrieved" })
  async getProfile(@Request() req) {
    console.log("Auth/me endpoint called with user ID:", req.user.id);

    try {
      const userProfile = await this.authService.getUserProfile(req.user.id);
      console.log("User profile retrieved:", {
        id: userProfile.id,
        email: userProfile.email,
        wallet: userProfile.wallet,
        hasWalletProperty: !!userProfile.wallet,
        walletBalance: userProfile.wallet?.balance,
      });
      return userProfile;
    } catch (error) {
      console.error("Error retrieving user profile:", error.message);
      throw error;
    }
  }
}
