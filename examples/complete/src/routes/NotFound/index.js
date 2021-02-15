import { loadable } from 'utils/router'

export default {
  component: loadable(() =>
    import(/* webpackChunkName: 'NotFound' */ './components/NotFoundPage')
  )
}
