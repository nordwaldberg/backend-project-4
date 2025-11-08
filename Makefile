install:
	npm ci

publish:
	npm publish --dry-run

page-loader:
	node bin/page-loader.js

lint:
	npx eslint .

test:
	npm test

test-coverage:
	npm test -- --coverage