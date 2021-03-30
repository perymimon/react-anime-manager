<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [init storybook](#init-storybook)
- [from story book distribute document](#from-story-book-distribute-document)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

#  init storybook

```bash 
npx sb init
npm install --save-dev semantic-release
```


# from story book distribute document

```bash
#`package.json/scripts` change build process to export to `dist` directory by babel
"build": "cross-env BABEL_ENV=production babel src -d dist",

#install auto deploy 
npm i -D auto 
#add .env
GH_TOKEN=<value you just got from GitHub>
NPM_TOKEN=<value you just got from npm>
# create labels on github issue
auto create-labels
npm version 0.1.0 -m "Bump version to: %s [skip ci]"
npm publish
git push --follow-tags origin master
#use Auto to create a release on GitHub:
auto release
# add package.json scripts
"release": "auto shipit --base-branch=master",

```