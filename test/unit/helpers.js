/* eslint-disable no-console, import/prefer-default-export */

export function display(obj, message = '') {
  console.log(message, JSON.stringify(obj, null, 2));
}
