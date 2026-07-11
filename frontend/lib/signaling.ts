export interface SignalMessage {
  type: string;
  target?: string;
  from?: string;
  peer_id?: string;
  peers?: string[];
  name?: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  [key: string]: unknown;
}
