import theme from './theme';

export const parameters = {
  layout:'centered',
  previewTabs: {
    canvas: {hidden: true},
  },
  docs:{
    theme,
    source: {
      type: 'code'
    }
  },
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    disabled: false,
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  options: {
    storySort:{
      order:[
          'Overview',
          ['Introduction'],
          'Hooks',
          'Usage',
          'Examples'
          ['AnimeManager']

      ]
    }

  },
}