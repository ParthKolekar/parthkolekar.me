/* 
    ZKP : Zero Knwoledge Proof (https://en.wikipedia.org/wiki/Zero-knowledge_proof#Abstract_example)

    In this example, Peggy knows the secret word to open a magical door in a cave.
    This door interconnects all the entrances to the cave. The cave has 2 ** 32
    entrances. Thus knowing the secret word allows Peggy to move between all the 
    entrances and go in and come out from whichever one she wants.

    Peggy wants to convince Victor that she knows this word without revealing to him, 
    the secret word. I.E. She wants to convince Victor that she knows the work,
    giving him Zero Knowledge about the actual magic word.

    To do this, she devices a novel method.

    Peggy will go in through any entrance unknown to Victor. Victor will now shout
    a entrance number. The probhablity that Peggy has guessed the correct entrance
    is 2 ^ -32 

    Since this is such a negligible number, Victor will get convinced if Peggy is
    able to do this.

    Peggy is gone, and now, *you* want to convince Peggy that you know the secret word
    but you do not know the secret word. Can you still convince Victor?
 */

#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>


int main(int argc, char const *argv[]) {
    int victor;
    int peggy;
    char buf[1024] = { 0 };

    int p;

    // Turn off output buffering so we can see output right away
    // not related to CTF lol :P
    setbuf(stdout, NULL);

    printf("Since Peggy is not present, we need you to substitute for her\n");
    printf("You do know the secret words right?\n");

    printf("Victor is making a choice.\n");
    
    // Victor generates a random number 
    int fd = open("/dev/urandom", O_RDONLY);
    read(fd, &victor, sizeof(int)) != sizeof(int);
    close(fd);

    // Allow Peggy to make her choices as many times as she wants until she is ready.
    int choice = 0;
    while(!choice) {
        printf("Enter Door : \n");
        fgets(buf, sizeof(buf), stdin);
        peggy = strtol(buf, NULL, 10);

        printf("You entered : ");
        printf(buf);
        printf("\n");

        printf("Are you sure? (y/n)\n");

        fgets(buf, sizeof(buf), stdin);        
        choice = buf[0] == 'y';
    }

    if (victor != peggy) {
        printf("Victor has caught you cheating in the act.\n");
        return -1;
    }
    
    printf("Victor is now convinced that you know the secret word for the door\n");
    printf("He gives you the flag\n");
    system("cat ./flag.txt");   

    return 0;
}