#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <algorithm>

struct StudentScore {
    std::string name;
    int testNumber;
    int marks;
    double percentage;
};

int main() {
    std::cout << "==========================================\n";
    std::cout << " CHITKARA UNIVERSITY PRACTICE LEADERBOARD \n";
    std::cout << "==========================================\n";

    // Read recorded results if available
    std::cout << "Rank\tStudent\t\tTest\tMarks\tPercentage\n";
    std::cout << "------------------------------------------\n";
    std::cout << "1\tDemo Student\tTest 1\t24/26\t92.3%\n";
    std::cout << "==========================================\n";

    return 0;
}
