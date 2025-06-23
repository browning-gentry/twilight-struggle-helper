import ctypes.util
import os
import sys

# Add system libraries to path
if sys.platform == 'darwin':  # macOS
    lib_path = '/usr/lib'
    # Add more system library paths
    extra_paths = [
        '/usr/local/lib',
        '/opt/homebrew/lib',
        '/System/Library/Frameworks/Python.framework/Versions/Current/lib'
    ]
    if os.path.exists(lib_path):
        os.environ['DYLD_LIBRARY_PATH'] = lib_path

    # Add extra paths if they exist
    for path in extra_paths:
        if os.path.exists(path):
            os.environ['DYLD_LIBRARY_PATH'] = f"{os.environ.get('DYLD_LIBRARY_PATH', '')}:{path}"

# Pre-load some common system libraries
def find_library(name: str) -> str | None:
    return ctypes.util.find_library(name)

for lib in ['c', 'm', 'pthread', 'dl']:
    find_library(lib)
