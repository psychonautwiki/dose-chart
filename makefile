all:
	@cd ddc ; tsickle
	@ls -a ddc/dist
	@echo
	@echo The resulting JavaScript file is meant to be passed into ClosureCompiler in advanced mode. Make sure to verify that non-debug codepaths are not shipped.
