import {RxStompService} from './rx-stomp';

export function RxStompServiceFactory() {
  const rxStomp = new RxStompService();
  rxStomp.configure({
    brokerURL: 'ws://localhost:8080/ws',
    reconnectDelay: 200,
    debug: (msg: string) => {
      console.log(new Date(), msg);
    },
  });
  rxStomp.activate();
  return rxStomp;
}
