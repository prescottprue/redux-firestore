import { isObject, mapValues } from 'lodash';
import { Dispatch } from 'redux';

/**
 * Build payload by invoking payload function if it a function, otherwise
 * returning the payload.
 * @param  {Function|Object|Boolean} payload - Payload value (invoked if it
 * is a function)
 * @param  {Any} valToPass - Value to pass to custom payload function
 * @return {Any} Result of building payload
 */
function makePayload(payloadSettings: ActionTypeObject, valToPass: any): any {
  const { payload } = payloadSettings
  return typeof payload === 'function' ? payload(valToPass) : payload;
}

interface MergeSettings {
  docs: boolean | undefined
  collections: boolean | undefined
}

interface ActionTypeObject {
  type: string
  payload?: any
  preserve?: boolean
  merge?: MergeSettings
  meta?: any
}

interface WrapInDispatchOptions {
  method: string
  types: (ActionTypeObject|string)[]
  ref: any
  meta?: any
  args?: string[]
}

/**
 * @description Wrap method call in dispatched actions
 * @param dispatch - Action dispatch function
 * @param opts - Options object
 * @param opts.method - Method to call
 * @param opts.args - Arguments to call method with
 * @param opts.types - Action types array ([BEFORE, SUCCESS, FAILURE])
 * @returns Resolves with result of calling promise
 * @private
 */
export function wrapInDispatch(
  dispatch: Dispatch,
  wrapOptions: WrapInDispatchOptions,
): Promise<any> {
  const { ref, meta = {}, method, args = [], types } = wrapOptions
  const [requestingType, successType, errorType] = types;
  dispatch({
    type: isObject(requestingType) ? requestingType.type : requestingType,
    meta,
    payload: isObject(requestingType) ? requestingType.payload : { args },
  });
  return ref[method](...args)
    .then((result: any) => {
      // Built action object handling function for custom payload
      const actionObj: ActionTypeObject = {
        type: typeof successType === 'string' ? successType : successType.type,
        meta,
        payload: typeof successType !== 'string'
            ? makePayload(successType, result)
            : { args },
      };
      // Attach preserve to action if it is passed
      if (typeof successType !== 'string' && successType.preserve) {
        actionObj.preserve = successType.preserve;
      }
      // Attach merge to action if it is passed
      if (typeof successType !== 'string' && successType.merge) {
        actionObj.merge = successType.merge;
      }
      dispatch(actionObj);
      return result;
    })
    .catch((err: Error) => {
      dispatch({
        type: errorType,
        meta,
        payload: err,
      });
      return Promise.reject(err);
    });
}

/**
 * Function that builds a factory that passes firebase and dispatch as
 * first two arguments.
 * @param  {Object} firebase - Internal firebase instance
 * @param  {Function} dispatch - Redux's dispatch function
 * @return {Function} A wrapper that accepts a function to wrap with firebase
 * and dispatch.
 */
function createWithFirebaseAndDispatch<TFunc>(firebase: any, dispatch: Dispatch): any {
  return (func: TFunc | any) => (...args: any[]) =>
    func.apply(firebase, [firebase, dispatch, ...args]);
}


interface MethodAliasSettings {
  action: any
  name: string
}

/**
 * Map each action with Firebase and Dispatch. Includes aliasing of actions.
 * @param  {Object} firebase - Internal firebase instance
 * @param  {Function} dispatch - Redux's dispatch function
 * @param  {Object} actions - Action functions to map with firebase and dispatch
 * @param  {Object} aliases - List of name aliases for wrapped functions
 * @return {Object} Actions mapped with firebase and dispatch
 */
export function mapWithFirebaseAndDispatch(
  firebase: any,
  dispatch: Dispatch,
  actions: any,
  aliases: MethodAliasSettings[],
): any {
  const withFirebaseAndDispatch = createWithFirebaseAndDispatch(
    firebase,
    dispatch,
  );
  return {
    ...mapValues(actions, withFirebaseAndDispatch),
    ...aliases.reduce(
      (acc, { action, name }) => ({
        ...acc,
        [name]: withFirebaseAndDispatch(action),
      }),
      {},
    ),
  };
}
