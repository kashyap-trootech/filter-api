import express, { Request, Response } from "express";
import axios, { isAxiosError } from "axios";

type FilterClauseType = {
  id: string;
  condition: "equals" | "does_not_equal" | "greater_than" | "less_than";
  value: number | string;
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/:formId/filteredResponses", async (req: Request, res: Response) => {
  const { formId } = req.params;
  const { filters } = req.query;

  try {
    if (!filters) {
      return res.status(400).json({ error: "Filters required" });
    }

    try {
      const parsedFilters = JSON.parse(filters as string);
      const responses = await filterResponses(formId as string, parsedFilters);

      res.json(responses);
    } catch (e: any) {
      res.status(500).json({ error: "Please provide valid filters Array" });
    }
  } catch (error) {
    console.error("Error", error);
    if (isAxiosError(error)) {
      if (error.response && error.response.status) {
        res
          .status(error.response.status)
          .json({ error: error.response.statusText });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

async function filterResponses(formId: string, filters: FilterClauseType[]) {
  const response = await axios.get(
    `https://api.fillout.com/v1/api/forms/${formId}/submissions`,
    {
      headers: {
        Authorization:
          "Bearer sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912",
      },
    }
  );

  const filteredResponses = response.data.responses.filter((response: any) => {
    return filters.every((filter) => {
      const question = response.questions.find(
        (question: any) => question.id === filter.id
      );

      if (!question) return false;

      switch (filter.condition) {
        case "equals":
          return question.value === filter.value;
        case "does_not_equal":
          return question.value !== filter.value;
        case "greater_than":
          return question.value > filter.value;
        case "less_than":
          return question.value < filter.value;
        default:
          return false;
      }
    });
  });

  return {
    responses: filteredResponses,
    totalResponses: filteredResponses?.length || 0,
    pageCount: response.data.pageCount,
  };
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
