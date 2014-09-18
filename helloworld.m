#include <Foundation/Foundation.h>

int main(void)
{
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];
    NSLog(@"Hello World!.");
    [pool drain];
 return;
}
