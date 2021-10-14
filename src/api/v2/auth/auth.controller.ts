import {Body, Controller, Get, Ip, Post, UseGuards} from '@nestjs/common';
import {AuthService} from './auth.service';
import {SignupCredentialDto} from './dto/signup-credential.dto';
import {SignInCredentialDto} from "./dto/signin-credential.dto";
import {ReqProfile} from "../../../core/decorators/req-profile.decorator";
import {ProfileEntity} from "../../../common/entities/profile.entity";
import {JwtAuthGuard} from "../../../core/guard/jwt-auth.guard";
import {ApiKeyGuard} from "../../../core/guard/api-key-auth.guard";
import {RolesGuard} from "../../../core/guard/role.guard";
import {Roles} from "../../../core/decorators/roles.decorator";
import {Role} from "@prisma/client";

@Controller('v2/auth')
@UseGuards(JwtAuthGuard, ApiKeyGuard, RolesGuard)
export class AuthController {
  constructor(private readonly service: AuthService) {
  }

  @Post('/signup')
  async register(@Body() body: SignupCredentialDto): Promise<{ status: string }> {
    return await this.service.register(body);
  }

  @Post('/signin')
  async signIn(
    @Ip() ip: any,
    @Body() body: SignInCredentialDto
  ): Promise<{ token: string }> {
    return this.service.signIn(ip, body);
  }

  @Roles(Role.HUMAN_RESOURCE)
  @Get()
  findAll(@ReqProfile() profile: ProfileEntity) {
    return this.service.findAll(profile);
  }
}
