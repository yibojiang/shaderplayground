# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 3.7

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:


#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:


# Remove some rules from gmake that .SUFFIXES does not remove.
SUFFIXES =

.SUFFIXES: .hpux_make_needs_suffix_list


# Suppress display of executed commands.
$(VERBOSE).SILENT:


# A target that is always out of date.
cmake_force:

.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /Users/yjiang6/Applications/CMake.app/Contents/bin/cmake

# The command to remove a file.
RM = /Users/yjiang6/Applications/CMake.app/Contents/bin/cmake -E remove -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /Users/yjiang6/Documents/Programming/shaderplayground

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /Users/yjiang6/Documents/Programming/shaderplayground/build

# Include any dependencies generated for this target.
include src/CMakeFiles/playground.dir/depend.make

# Include the progress variables for this target.
include src/CMakeFiles/playground.dir/progress.make

# Include the compile flags for this target's objects.
include src/CMakeFiles/playground.dir/flags.make

src/CMakeFiles/playground.dir/main.cpp.o: src/CMakeFiles/playground.dir/flags.make
src/CMakeFiles/playground.dir/main.cpp.o: ../src/main.cpp
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/Users/yjiang6/Documents/Programming/shaderplayground/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building CXX object src/CMakeFiles/playground.dir/main.cpp.o"
	cd /Users/yjiang6/Documents/Programming/shaderplayground/build/src && /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/c++   $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -o CMakeFiles/playground.dir/main.cpp.o -c /Users/yjiang6/Documents/Programming/shaderplayground/src/main.cpp

src/CMakeFiles/playground.dir/main.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/playground.dir/main.cpp.i"
	cd /Users/yjiang6/Documents/Programming/shaderplayground/build/src && /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/c++  $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /Users/yjiang6/Documents/Programming/shaderplayground/src/main.cpp > CMakeFiles/playground.dir/main.cpp.i

src/CMakeFiles/playground.dir/main.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/playground.dir/main.cpp.s"
	cd /Users/yjiang6/Documents/Programming/shaderplayground/build/src && /Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/c++  $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /Users/yjiang6/Documents/Programming/shaderplayground/src/main.cpp -o CMakeFiles/playground.dir/main.cpp.s

src/CMakeFiles/playground.dir/main.cpp.o.requires:

.PHONY : src/CMakeFiles/playground.dir/main.cpp.o.requires

src/CMakeFiles/playground.dir/main.cpp.o.provides: src/CMakeFiles/playground.dir/main.cpp.o.requires
	$(MAKE) -f src/CMakeFiles/playground.dir/build.make src/CMakeFiles/playground.dir/main.cpp.o.provides.build
.PHONY : src/CMakeFiles/playground.dir/main.cpp.o.provides

src/CMakeFiles/playground.dir/main.cpp.o.provides.build: src/CMakeFiles/playground.dir/main.cpp.o


# Object files for target playground
playground_OBJECTS = \
"CMakeFiles/playground.dir/main.cpp.o"

# External object files for target playground
playground_EXTERNAL_OBJECTS =

src/playground: src/CMakeFiles/playground.dir/main.cpp.o
src/playground: src/CMakeFiles/playground.dir/build.make
src/playground: src/libshader.a
src/playground: src/CMakeFiles/playground.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --bold --progress-dir=/Users/yjiang6/Documents/Programming/shaderplayground/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Linking CXX executable playground"
	cd /Users/yjiang6/Documents/Programming/shaderplayground/build/src && $(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/playground.dir/link.txt --verbose=$(VERBOSE)
	cd /Users/yjiang6/Documents/Programming/shaderplayground/build/src && /Users/yjiang6/Applications/CMake.app/Contents/bin/cmake -E copy /Users/yjiang6/Documents/Programming/shaderplayground/build/src/playground /Users/yjiang6/Documents/Programming/shaderplayground/bin/playground
	cd /Users/yjiang6/Documents/Programming/shaderplayground/bin && /Users/yjiang6/Documents/Programming/shaderplayground/build/src/playground

# Rule to build all files generated by this target.
src/CMakeFiles/playground.dir/build: src/playground

.PHONY : src/CMakeFiles/playground.dir/build

src/CMakeFiles/playground.dir/requires: src/CMakeFiles/playground.dir/main.cpp.o.requires

.PHONY : src/CMakeFiles/playground.dir/requires

src/CMakeFiles/playground.dir/clean:
	cd /Users/yjiang6/Documents/Programming/shaderplayground/build/src && $(CMAKE_COMMAND) -P CMakeFiles/playground.dir/cmake_clean.cmake
.PHONY : src/CMakeFiles/playground.dir/clean

src/CMakeFiles/playground.dir/depend:
	cd /Users/yjiang6/Documents/Programming/shaderplayground/build && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /Users/yjiang6/Documents/Programming/shaderplayground /Users/yjiang6/Documents/Programming/shaderplayground/src /Users/yjiang6/Documents/Programming/shaderplayground/build /Users/yjiang6/Documents/Programming/shaderplayground/build/src /Users/yjiang6/Documents/Programming/shaderplayground/build/src/CMakeFiles/playground.dir/DependInfo.cmake --color=$(COLOR)
.PHONY : src/CMakeFiles/playground.dir/depend

