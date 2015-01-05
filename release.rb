#!/usr/bin/env ruby 
require 'json'

# Get the version number
hash = JSON.parse(File.read('package.json'))

version = hash['version']

`git tag #{version}`
`git commit -am "version #{version}"`
`git push --tags origin master`
