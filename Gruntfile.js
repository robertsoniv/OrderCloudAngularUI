module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-ng-annotate');

	var userConfig = require( './build.config.js' );

	var taskConfig = {
		pkg: grunt.file.readJSON("package.json"),
		meta: {
			banner:
				'/**\n' +
				' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
				' * <%= pkg.homepage %>\n' +
				' *\n' +
				' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
				' * Licensed <%= pkg.licenses.type %> <<%= pkg.licenses.url %>>\n' +
				' */\n'
		},
		clean: [
			'<%= compile_dir %>',
			'<%= build_dir %>'
		],
		concat: {
			compile_js: {
				options: {
					banner: '<%= meta.banner %>'
				},
				src: [
					'<%= vendor_files.js %>',
					'module.prefix',
					'<%= app_files.js %>',
					'module.suffix'
				],
				dest: '<%= compile_dir %>/<%= pkg.name %>.min.js'
			},
			build_js: {
				options: {
					banner: '<%= meta.banner %>'
				},
				src: [
					'<%= vendor_files.js %>',
					'module.prefix',
					'<%= app_files.js %>',
					'module.suffix'
				],
				dest: '<%= compile_dir %>/<%= pkg.name %>.js'
			}
		},
		ngAnnotate: {
			compile: {
				files: [
					{
						'<%= concat.build_js.dest %>': ['<%= concat.build_js.dest %>']
					}
				]
			}
		},
		uglify: {
			compile: {
				options: {
					banner: '<%= meta.banner %>'
				},
				files: {
					'<%= concat.compile_js.dest %>': '<%= concat.compile_js.dest %>'
				}
			}
		},
		karma: {
			options: {
				configFile: '<%= build_dir %>/karma-unit.js'
			},
			unit: {
				port: 9019,
				background: true
			},
			continuous: {
				singleRun: true
			}
		},
		copy: {
			vendors: {
				expand: true,
				src: ['<%= vendor_files.js %>','<%= vendor_files.less %>','<%= vendor_files.css %>'],
				dest: '<%= compile_dir %>'
			},
			src: {
				cwd: 'src/',
				expand: true,
				src: ['<%= app_files.custom_modules %>','<%= app_files.less %>'],
				dest: '<%= compile_dir %>/modules'
			}

		}
	};

	grunt.initConfig( grunt.util._.extend( userConfig, taskConfig ) );

	grunt.registerTask( 'compile', [
		'clean', 'concat:build_js', 'ngAnnotate', 'concat:compile_js', 'uglify', 'copy:src', 'copy:vendors'
	]);
};