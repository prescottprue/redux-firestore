/* eslint-disable no-unused-vars */
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

process.env.NODE_ENV = 'test';

// Chai Plugins
chai.use(sinonChai);

// globals
(global as any).expect = chai.expect;
(global as any).sinon = sinon;
(global as any).chai = chai;
