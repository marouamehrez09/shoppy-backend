import {
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: ['https://shoppy-ui-app.vercel.app', 'http://localhost:3000'], // no trailing slash
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ProductsGateway {
  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  private readonly server: Server;

  handleProductUpdated() {
    this.server.emit('productUpdated');
  }

  handleConnection(client: Socket) {
    try {
      const auth = client.handshake.auth?.Authentication;
      console.log('🔎 Received token object:', auth);

      const token = typeof auth === 'string' ? auth : auth?.value; // ✅ extract value if object
      if (!token) {
        console.log('❌ No token provided');
        throw new WsException('No token provided');
      }

      this.authService.verifyToken(token); // now a raw JWT string
      console.log(`✅ Client connected: ${client.id}`);
    } catch (err) {
      console.error('❌ Unauthorized client:', err.message);
      client.disconnect();
      throw new WsException('Unauthorized.');
    }
  }
}
