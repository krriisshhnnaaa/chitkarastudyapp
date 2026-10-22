#include <iostream>
#include <fstream>
#include <string>
#include <sstream>
#include <vector>
#include <cstdlib>
#include <ctime>

// Helper: escape quotes for JSON/shell
std::string escapeJson(const std::string& input) {
    std::string output;
    for (char c : input) {
        if (c == '"') output += "\\\"";
        else if (c == '\\') output += "\\\\";
        else output += c;
    }
    return output;
}

// Function to add user to MongoDB database
bool insertIntoMongoDB(const std::string& name, const std::string& email) {
    // Construct MongoDB mongosh insertion command
    // Uses local database 'studyapp' and collection 'users'
    std::ostringstream cmd;
    cmd << "mongosh --quiet --eval '"
        << "try { "
        << "  db = connect(\"mongodb://127.0.0.1:27017/studyapp\"); "
        << "  db.users.insertOne({ name: \"" << escapeJson(name) << "\", email: \"" << escapeJson(email) << "\", registeredAt: new Date() }); "
        << "  print(\"[MONGODB SUCCESS] Inserted user into collection users\"); "
        << "} catch (e) { "
        << "  print(\"[MONGODB NOTICE] MongoDB server not active on 27017, fallback to local database directory\"); "
        << "}' 2>/dev/null";

    int ret = std::system(cmd.str().c_str());
    return (ret == 0);
}

// Function to append user to local database directory JSON storage (database/users.json)
bool insertIntoLocalDb(const std::string& name, const std::string& email) {
    std::string dbPath = "database/users.json";
    std::ifstream inFile(dbPath);
    std::string content = "";
    if (inFile.is_open()) {
        std::stringstream buffer;
        buffer << inFile.rdbuf();
        content = buffer.str();
        inFile.close();
    }

    // Get current ISO timestamp
    std::time_t now = std::time(nullptr);
    char buf[100];
    std::strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", std::gmtime(&now));
    std::string timestamp(buf);

    std::string userObj = "  {\n    \"name\": \"" + escapeJson(name) + "\",\n    \"email\": \"" + escapeJson(email) + "\",\n    \"registeredAt\": \"" + timestamp + "\"\n  }";

    if (content.empty() || content.find("[") == std::string::npos) {
        content = "[\n" + userObj + "\n]";
    } else {
        // Strip trailing ']' and any whitespace
        size_t lastBracket = content.rfind(']');
        if (lastBracket != std::string::npos) {
            std::string prefix = content.substr(0, lastBracket);
            // Check if there are existing entries
            size_t firstBracket = prefix.find('{');
            if (firstBracket != std::string::npos) {
                // Has previous items, add comma
                prefix += ",\n" + userObj + "\n]";
            } else {
                prefix += "\n" + userObj + "\n]";
            }
            content = prefix;
        }
    }

    std::ofstream outFile(dbPath);
    if (outFile.is_open()) {
        outFile << content;
        outFile.close();
        return true;
    }
    return false;
}

int main(int argc, char* argv[]) {
    std::string name = "";
    std::string email = "";
    std::string mode = "signup"; // "login" or "signup"

    if (argc >= 3) {
        name = argv[1];
        email = argv[2];
        if (argc >= 4) mode = argv[3];
    } else {
        std::cout << "Enter Name: ";
        std::getline(std::cin, name);
        std::cout << "Enter Email: ";
        std::getline(std::cin, email);
    }

    if (name.empty() || email.empty()) {
        std::cerr << "[ERROR] Name and Email cannot be empty.\n";
        return 1;
    }

    std::cout << "\n==========================================\n";
    std::cout << " CHITKARA UNIVERSITY DATABASE USER SERVICE \n";
    std::cout << "==========================================\n";
    std::cout << " Mode  : " << mode << "\n";
    std::cout << " Name  : " << name << "\n";
    std::cout << " Email : " << email << "\n";
    std::cout << "==========================================\n";

    if (mode == "signup") {
        std::cout << "[INFO] Registering new user...\n";

        // 1. Attempt MongoDB Insertion
        std::cout << "[INFO] Connecting to MongoDB...\n";
        insertIntoMongoDB(name, email);

        // 2. Persist in local database/ directory
        if (insertIntoLocalDb(name, email)) {
            std::cout << "[SUCCESS] User recorded in database/users.json\n";
        } else {
            std::cerr << "[WARNING] Could not update database/users.json\n";
        }

        std::cout << "[SUCCESS] Signup complete for " << name << " <" << email << ">\n";
    } else {
        // Mode == "login"
        std::ifstream dbFile("database/users.json");
        std::string dbStr;
        bool found = false;
        if (dbFile.is_open()) {
            std::stringstream buffer;
            buffer << dbFile.rdbuf();
            dbStr = buffer.str();
            dbFile.close();

            if (dbStr.find("\"name\": \"" + name + "\"") != std::string::npos &&
                dbStr.find("\"email\": \"" + email + "\"") != std::string::npos) {
                found = true;
            }
        }

        if (found) {
            std::cout << "[SUCCESS] User matched in database! Redirecting to main.html\n";
            return 0;
        } else {
            std::cout << "[FAILED] User not found in database.\n";
            return 1;
        }
    }

    return 0;
}
