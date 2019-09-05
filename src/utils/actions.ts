import { isObject, isFunction, mapValues } from 'lodash';
import { Dispatch } from 'redux';

/**
 * Build payload by invoking payload function if it a function, otherwise
 * returning the payload.
 * @param  {Function|Object|Boolean} payload - Payload value (invoked if it
 * is a function)
 * @param  {Any} valToPass - Value to pass to custom payload function
 * @return {Any} Result of building payload
 */
function makePayload(payloadSettings: ActionTypeObject, valToPass: any) {
  const { payload } = payloadSettings
  return isFunction(payload) ? payload(valToPass) : payload;
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
}

interface WrapInDispatchOptions {
  method: string
  types: (ActionTypeObject|string)[]
  ref: any
  meta: any
  args?: string[]
}

/**
 * @description Wrap method call in dispatched actions
 * @param dispatch - Action dispatch function
 * @param opts - Options object
 * @param opts.method - Method to call
 * @param opts.args - Arguments to call method with
 * @param opts.types - Action types array ([BEFORE, SUCCESS, FAILURE])
 * @return {Promise}
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
      const successIsObject = isObject(successType);
      // Built action object handling function for custom payload
      const actionObj = {
        type: successIsObject ? successType.type : successType,
        meta,
        payload:
          successIsObject && successType.payload
            ? makePayload(successType, result)
            : { args },
      };
      // Attach preserve to action if it is passed
      if (successIsObject && successType.preserve) {
        actionObj.preserve = successType.preserve;
      }
      // Attach merge to action if it is passed
      if (successIsObject && successType.merge) {
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
function createWithFirebaseAndDispatch<TFunc>(firebase: any, dispatch: Dispatch) {
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
