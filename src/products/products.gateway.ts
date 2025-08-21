import {
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: 'https://shoppy-ui-app.vercel.app', // Explicitly allow your frontend origin
    methods: ['GET', 'POST'],
    credentials: true, // If your auth requires cookies or credentials
  },
})
export class ProductGateway {
  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  private readonly server: Server;

  handleProductUpdated() {
    this.server.emit('productUpdated');
  }

  handleConnection(client: Socket) {
    try {
      this.authService.verifyToken(client.handshake.auth.Authentication.value);
    } catch (err) {
      throw new WsException('Unauthorized.');
    }
  }
}
