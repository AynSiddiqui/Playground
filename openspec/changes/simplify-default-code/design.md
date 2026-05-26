## Context
The current default C++ code provided in the visualizer includes complex logic like `struct Node`, pointer assignments, and `new`/`delete` calls. While this is great for showing off heap memory and relationships, it creates a steep learning curve for users who just want to see a basic arithmetic calculation and memory variables updating in real time.

## Goals / Non-Goals
**Goals:**
- Replace the `DEFAULT_CODE` string with a highly simplified, 5-line C++ program that only does `int a = 10; int b = 20; int c = a + b;`.
- Ensure all pointer logic and standard library calls (like `std::endl` or complex `std::cout` chains) are removed to minimize visual noise.

**Non-Goals:**
- Add complex parsing to "hide" variables before they are declared. We will embrace C++'s native memory behavior (showing stack allocations early) but we will use clean, simple numbers.

## Decisions
- **`DEFAULT_CODE` content:** The new code will be exactly:
```cpp
#include <iostream>

int main() {
    int a = 10;
    int b = 20;
    int c = a + b;
    std::cout << c << "\n";
    return 0;
}
```

## Risks / Trade-offs
- **Trade-off:** New users won't immediately see the "Heap" visualization unless they manually type in `new`. This is acceptable because a simple interface is prioritized for the "first look" experience.
