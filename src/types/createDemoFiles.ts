
export  const createDemoFiles = () => {
    const demoTxtContent = `VISIBLE
INPUT:
5 3
OUTPUT:
8

INPUT:
10 20
OUTPUT:
30

INPUT:
1 1
OUTPUT:
2

HIDDEN
INPUT:
100 200
OUTPUT:
300

INPUT:
-5 10
OUTPUT:
5

INPUT:
0 0
OUTPUT:
0`;

    const demoJsonContent = {
      visible_testcases: [
        { input: "5 3", expected_output: "8" },
        { input: "10 20", expected_output: "30" },
        { input: "1 1", expected_output: "2" },
      ],
      hidden_testcases: [
        { input: "100 200", expected_output: "300" },
        { input: "-5 10", expected_output: "5" },
        { input: "0 0", expected_output: "0" },
      ],
    };

    return { demoTxtContent, demoJsonContent };
  };
