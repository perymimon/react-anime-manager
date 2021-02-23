#  init storybook

```bash 
npx sb init
npm install --save-dev semantic-release
```


# from story book distribute document

```bash
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