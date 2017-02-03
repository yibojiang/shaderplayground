


add_executable(playground main.cpp)
add_library(shader shader.cpp)


target_link_libraries(playground libGLEW.a)
target_link_libraries(playground libglfw3.a)
target_link_libraries(playground libSOIL.a)
target_link_libraries(playground shader)

IF(APPLE)
   find_library(COCOA_LIBRARY Cocoa)
   find_library(OPENGL_LIBRARY OpenGL)
   find_library(COREVIDEO_LIBRARY CoreVideo)
   find_library(IOKIT_LIBRARY IOKit)
   MARK_AS_ADVANCED (COCOA_LIBRARY
                     OPENGL_LIBRARY
                     COREVIDEO_LIBRARY
                     IOKIT_LIBRARY)
   SET(EXTRA_LIBS ${COCOA_LIBRARY} ${OPENGL_LIBRARY} ${COREVIDEO_LIBRARY} ${IOKIT_LIBRARY})
ENDIF (APPLE)

target_link_libraries(playground ${EXTRA_LIBS})

add_custom_command(TARGET playground POST_BUILD
                   COMMAND ${CMAKE_COMMAND} -E copy
                       ${CMAKE_SOURCE_DIR}/build/src/playground ${CMAKE_SOURCE_DIR}/bin/playground)

