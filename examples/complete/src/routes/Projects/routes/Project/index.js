import { loadable } from 'utils/router'

export default {
  path: ':projectId',
  component: loadable(() =>
    import(/* webpackChunkName: 'Project' */ './components/ProjectPage')
  )
}
