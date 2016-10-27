

# Add executable called "helloDemo" that is built from the source files
# "demo.cxx" and "demo_b.cxx". The extensions are automatically found.
# LINK_DIRECTORIES(.)
add_executable(playground main.cpp)

# Link the executable to the Hello library. Since the Hello library has
# public include directories we will use those link directories when building
# helloDemo
# target_link_libraries (helloDemo LINK_PUBLIC Hello)

add_library(shader shader.cpp)


target_link_libraries(playground libGLEW.a)
target_link_libraries(playground libglfw3.a)
target_link_libraries(playground libSOIL.a)
target_link_libraries(playground shader)

IF(APPLE)
   find_library(COCOA_LIBRARY Cocoa)
   find_library(OPENGL_LIBRARY OpenGL )
   find_library(COREVIDEO_LIBRARY CoreVideo)
   find_library(IOKIT_LIBRARY IOKit )
   MARK_AS_ADVANCED (COCOA_LIBRARY
                     OPENGL_LIBRARY
                     COREVIDEO_LIBRARY
                     IOKIT_LIBRARY)
   SET(EXTRA_LIBS ${COCOA_LIBRARY} ${OPENGL_LIBRARY} ${COREVIDEO_LIBRARY} ${IOKIT_LIBRARY})
ENDIF (APPLE)

target_link_libraries( playground ${EXTRA_LIBS} )

# install(TARGETS playground DESTINATION bin)