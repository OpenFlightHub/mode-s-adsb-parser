# Tests

we are using jest for testing, test files can be found in `/tests`

```
npm run test
```

or on VSCode: `Ctrl` + `Shift` + `T`

# Debugging Examples

in `/src/index.ts` uncomment the lines that call `runExample()`

# Publishing to npm

## Generate distributable js code

* run: `npm run build` or in VSCOde `Ctrl` + `Shift` + `B`


## Generate coverage report

* run: `bash make_coverage_report.sh`

## Github

* edit CHANGELOG.md and add the new version
* commit
* Make sure you pushed git changes to github (so npmjs can cache the latest version of readme etc)
* create a new tag (version number)

## Publish to npm

* Make sure your version in the package.json has been changed
next step requires successfull login via `npm login`
* run `npm publish` (might require `--otp`)
