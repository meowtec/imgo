export type CallbackData =
  | {
      type: 'success';
      data: unknown;
    }
  | {
      type: 'fail';
      error: unknown;
    };

export type WorkerMessage =
  | 'INIT'
  | {
      type: 'call';
      name: string;
      id: string;
      params: unknown[];
    }
  | {
      type: 'return';
      id: string;
      data: CallbackData;
    }
  | {
      type: 'callback';
      id: string;
      index: number;
      data: unknown[];
    }
  | {
      type: 'finish';
      id: string;
    };

export const FUNCTION_PLACEHOLDER = '@FUNCTION_PLACEHOLDER@';
