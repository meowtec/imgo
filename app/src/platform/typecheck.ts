import * as tauri from './tauri/index';
import * as web from './web/index';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function typeIs<T, X extends T>(_a: T, _b: X) {}

typeIs(tauri, web);
typeIs(web, tauri);
