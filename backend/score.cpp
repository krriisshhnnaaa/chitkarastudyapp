#include <iostream>
#include <fstream>
#include <string>
#include <sstream>
#include <map>
#include <vector>
#include <cctype>
#include <algorithm>
#include <regex>

// Structure to hold single question result
struct QuestionResult {
    std::string questionKey;
    int questionNumber;
    std::string userOption;
    std::string correctOption;
    bool isCorrect;
};

// Helper: Trim whitespace
std::string trim(const std::string& str) {
    size_t first = str.find_first_not_of(" \t\n\r");
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(" \t\n\r");
    return str.substr(first, (last - first + 1));
}

// Helper: Extract option letter (A, B, C, D)
std::string extractOptionLetter(std::string raw) {
    raw = trim(raw);
    for (char c : raw) {
        c = std::toupper(static_cast<unsigned char>(c));
        if (c >= 'A' && c <= 'D') {
            return std::string(1, c);
        }
    }
    return raw;
}

// Simple JSON string-to-string key-value extractor (Zero external dependencies)
std::map<std::string, std::string> parseSimpleJsonMap(const std::string& jsonContent) {
    std::map<std::string, std::string> result;

    // Pattern 1: "question X": "A" or "question X": { "response": "A" }
    std::regex pairRegex(R"delimiter("(question\s*\d+|\d+)"\s*:\s*(?:"([^"]*)"|\{\s*"response"\s*:\s*"([^"]*)"\s*\}))delimiter", std::regex::icase);
    auto words_begin = std::sregex_iterator(jsonContent.begin(), jsonContent.end(), pairRegex);
    auto words_end = std::sregex_iterator();

    for (std::sregex_iterator i = words_begin; i != words_end; ++i) {
        std::smatch match = *i;
        std::string key = match[1].str();
        std::string val = match[2].matched ? match[2].str() : match[3].str();
        
        // Normalize key to standard "question X"
        std::regex numRegex(R"(\d+)");
        std::smatch numMatch;
        if (std::regex_search(key, numMatch, numRegex)) {
            key = "question " + numMatch[0].str();
        }
        result[key] = extractOptionLetter(val);
    }

    return result;
}

// Read entire file content into string
std::string readFile(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) return "";
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

int main(int argc, char* argv[]) {
    // Default file locations
    std::string responsePath = "response.json";
    std::string answerPath = "backend/answer_file1.json";
    std::string outputPath = "result.json";
    int testNumber = 1;

    // Handle command line arguments if supplied
    // Usage: ./score [response.json] [answer_file.json or test_num] [output.json]
    if (argc >= 2) {
        responsePath = argv[1];
    }
    if (argc >= 3) {
        std::string arg2 = argv[2];
        if (arg2.find(".json") != std::string::npos) {
            answerPath = arg2;
        } else {
            testNumber = std::stoi(arg2);
            answerPath = "backend/answer_file" + std::to_string(testNumber) + ".json";
        }
    }
    if (argc >= 4) {
        outputPath = argv[3];
    }

    // Try reading response file
    std::string responseContent = readFile(responsePath);
    if (responseContent.empty()) {
        // Fallback checks
        responseContent = readFile("database/response.json");
        if (responseContent.empty()) {
            responseContent = readFile("../database/response.json");
        }
    }

    if (responseContent.empty()) {
        std::cerr << "[ERROR] Could not read response file from: " << responsePath << "\n";
        std::cerr << "Usage: ./score [response.json] [answer_fileX.json] [output.json]\n";
        return 1;
    }

    // Check if response contains a specific test number
    std::regex testNumRegex(R"delimiter("test(?:Number)?"\s*:\s*(\d+))delimiter", std::regex::icase);
    std::smatch testMatch;
    if (std::regex_search(responseContent, testMatch, testNumRegex)) {
        testNumber = std::stoi(testMatch[1].str());
        if (argc < 3 || std::string(argv[2]).find(".json") == std::string::npos) {
            answerPath = "backend/answer_file" + std::to_string(testNumber) + ".json";
        }
    }

    // Try reading answers file
    std::string answerContent = readFile(answerPath);
    if (answerContent.empty()) {
        // Try alternate locations
        std::string altPath = "database/answer_file" + std::to_string(testNumber) + ".json";
        answerContent = readFile(altPath);
        if (answerContent.empty()) {
            answerContent = readFile("answer_file" + std::to_string(testNumber) + ".json");
        }
    }

    if (answerContent.empty()) {
        std::cerr << "[ERROR] Could not read answers file from: " << answerPath << "\n";
        return 1;
    }

    auto userResponses = parseSimpleJsonMap(responseContent);
    auto correctAnswers = parseSimpleJsonMap(answerContent);

    int marks = 0;
    int totalQuestions = correctAnswers.size();
    if (totalQuestions == 0) totalQuestions = 26; // Standard 26 questions per test

    std::vector<QuestionResult> results;

    for (int q = 1; q <= 26; ++q) {
        std::string key = "question " + std::to_string(q);
        std::string userAns = userResponses.count(key) ? userResponses[key] : "";
        std::string corrAns = correctAnswers.count(key) ? correctAnswers[key] : "";

        bool isCorrect = false;
        if (!userAns.empty() && !corrAns.empty() && userAns == corrAns) {
            marks += 1;
            isCorrect = true;
        }

        results.push_back({key, q, userAns, corrAns, isCorrect});
    }

    double percentage = totalQuestions > 0 ? (static_cast<double>(marks) / totalQuestions) * 100.0 : 0.0;

    // Output JSON result
    std::ostringstream jsonOut;
    jsonOut << "{\n";
    jsonOut << "  \"testNumber\": " << testNumber << ",\n";
    jsonOut << "  \"marks\": " << marks << ",\n";
    jsonOut << "  \"totalQuestions\": " << totalQuestions << ",\n";
    jsonOut << "  \"percentage\": " << percentage << ",\n";
    jsonOut << "  \"breakdown\": {\n";
    for (size_t i = 0; i < results.size(); ++i) {
        const auto& r = results[i];
        jsonOut << "    \"" << r.questionKey << "\": {\n";
        jsonOut << "      \"selected\": \"" << r.userOption << "\",\n";
        jsonOut << "      \"correct\": \"" << r.correctOption << "\",\n";
        jsonOut << "      \"isCorrect\": " << (r.isCorrect ? "true" : "false") << "\n";
        jsonOut << "    }" << (i + 1 < results.size() ? "," : "") << "\n";
    }
    jsonOut << "  }\n";
    jsonOut << "}\n";

    // Write to destination files
    std::string outJsonStr = jsonOut.str();
    std::ofstream outFile(outputPath);
    if (outFile.is_open()) {
        outFile << outJsonStr;
    }

    // Also write to testpages/score/result.json if testpages/score directory exists
    std::ofstream scorePageOut("testpages/score/result.json");
    if (scorePageOut.is_open()) {
        scorePageOut << outJsonStr;
    }

    // Print summary to console
    std::cout << "\n============================================\n";
    std::cout << " CHITKARA UNIVERSITY PRACTICE TESTS - SCORE \n";
    std::cout << "============================================\n";
    std::cout << " Test Number     : " << testNumber << "\n";
    std::cout << " Total Questions : " << totalQuestions << "\n";
    std::cout << " Marks Obtained  : " << marks << " / " << totalQuestions << "\n";
    std::cout << " Percentage      : " << percentage << " %\n";
    std::cout << " Status          : " << (percentage >= 50.0 ? "PASSED" : "NEEDS PRACTICE") << "\n";
    std::cout << "============================================\n\n";
    std::cout << outJsonStr << std::endl;

    return 0;
}
