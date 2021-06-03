import {addons} from '@storybook/addons';
import theme from './theme';

addons.setConfig({
    theme,
    isFullscreen: true,
    showNav: false,
    showPanel: true,
    panelPosition: 'bottom',
    enableShortcuts: true,
    isToolshown: false,
    selectedPanel: undefined,
    initialActive: 'sidebar',
    sidebar: {
        showRoots: true,
        collapsedRoots: ['other'],
    },
});