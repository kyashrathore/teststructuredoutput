import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import SchemaEditor from "./SchemaEditor";
import { AlertTriangle, Play } from "lucide-react";
import { allModels } from "./models";
import Select from "react-select";
import { generateHash } from "../utils/stressTestStorage";
import { SavedTest, SystemPromptTest } from "../types/stress-test";
import { useTestStore } from "../store/testStore";

export interface FormData {
  testName: string;
  models: string[];
  schema: string;
  systemPrompt: string;
  userPrompt: string;
  callTimes: number;
}

interface StressTestFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
  testName?: string;
  isCreateMode?: boolean;
}

const StressTestForm: React.FC<StressTestFormProps> = ({
  onSubmit,
  isLoading,
  testName,
  isCreateMode = false,
}) => {
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const savedTests = useTestStore((state) => state.savedTests);
  const selectedTestId = useTestStore((state) => state.selectedTestId);
  const editingSystemPromptHash = useTestStore(
    (state) => state.editingPromptHash
  );

  const selectTest = useTestStore((state) => state.selectTest);
  const selectPromptHashes = useTestStore((state) => state.selectPromptHashes);
  const setEditingPromptHash = useTestStore(
    (state) => state.setEditingPromptHash
  );
  const saveTestResults = useTestStore((state) => state.saveTestResults);
  const removeTest = useTestStore((state) => state.removeTest);
  const removeSystemPrompt = useTestStore((state) => state.removeSystemPrompt);

  const selectedTest = savedTests.find((t) => t.id === selectedTestId) || null;
  const editingSystemPrompt =
    selectedTest?.systemPrompts.find(
      (sp) => sp.systemPromptHash === editingSystemPromptHash
    ) || null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      testName: testName || "",
      models: ["openai/gpt-4.1"],
      schema: `import { z } from "zod";

 const personSchema = z.object({
  name: z.string().describe("The person's full name"),
  age: z.number().int().min(0),
  isStudent: z.boolean().optional(),
  interests: z.array(z.string()).describe("A list of hobbies or interests").optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional()
  }).optional()
});
export default personSchema;
`,
      systemPrompt:
        "You are an AI assistant designed to output structured JSON data based on the provided schema. Respond only with the valid JSON object.",
      userPrompt:
        "Generate realistic information for a fictional person including their name, age, student status, interests, and address (street and city).",
      callTimes: 1,
    },
  });

  useEffect(() => {
    if (selectedTest) {
      reset({
        testName: testName || selectedTest.testName,
        models: editingSystemPrompt?.models || [
          "openai/gpt-4o",
          "anthropic/claude-3.5-sonnet",
        ],
        schema: selectedTest.schema,
        userPrompt: selectedTest.userPrompt,
        callTimes: editingSystemPrompt?.callTimes ?? 1,
        systemPrompt: editingSystemPrompt?.systemPrompt || "",
      });
    } else if (testName) {
      setValue("testName", testName);
    }
  }, [
    selectedTestId,
    editingSystemPromptHash,
    selectedTest,
    editingSystemPrompt,
    reset,
    testName,
    setValue,
  ]);

  const handleFormSubmit = (data: FormData) => {
    try {
      setSchemaError(null);

      const finalTestName = testName || data.testName;

      // Pass all form data to parent for API call and saving
      onSubmit({ ...data, testName: finalTestName });
    } catch (e: any) {
      setSchemaError(`Invalid JSON Schema: ${e.message}`);
    }
  };

  const handleRemoveTest = (testId: string) => {
    removeTest(testId);
    if (selectedTestId === testId) {
      selectTest(null);
      setEditingPromptHash(null);
      selectPromptHashes([]);
      reset();
    }
  };

  const handleRemoveSystemPrompt = (
    testId: string,
    systemPromptHash: string
  ) => {
    removeSystemPrompt(testId, systemPromptHash);
    if (editingSystemPromptHash === systemPromptHash) {
      setEditingPromptHash(null);
      selectPromptHashes([]);
      setValue("systemPrompt", "");
    }
  };

  const testOptions = savedTests.map((test) => ({
    value: test.id,
    label: test.testName,
  }));

  const systemPromptOptions = selectedTest
    ? selectedTest.systemPrompts.map((sp) => ({
        value: sp.systemPromptHash,
        label:
          sp.systemPrompt.length > 40
            ? sp.systemPrompt.slice(0, 40) + "..."
            : sp.systemPrompt,
        runCount: sp.runCount,
      }))
    : [];

  const isEditingExistingTest = !!selectedTest;

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-white rounded-lg shadow flex flex-col"
    >
      <div className="p-6 space-y-6 flex-grow overflow-y-auto h-[calc(90dvh)]">
        <div className="space-y-4">
          {/* All form fields remain unchanged */}
          {!testName && (
            <div>
              <label
                htmlFor="testName"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Test Name
              </label>
              <input
                id="testName"
                {...register("testName", { required: "Test name is required" })}
                className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500  px-4 py-2 text-md text-black ${
                  errors.testName ? "border-red-500" : ""
                }`}
                aria-invalid={errors.testName ? "true" : "false"}
              />
              {errors.testName && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.testName.message}
                </p>
              )}
            </div>
          )}
          {!isCreateMode && selectedTest && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                System Prompt Variations
              </label>
              <Select
                isClearable
                placeholder="Select a system prompt variation..."
                options={systemPromptOptions}
                value={
                  systemPromptOptions.find(
                    (opt) => opt.value === editingSystemPromptHash
                  ) || null
                }
                onChange={(opt) => {
                  const hash = opt ? opt.value : null;
                  setEditingPromptHash(hash);
                  selectPromptHashes(hash ? [hash] : []);
                }}
                className="mb-2 text-slate-800"
                getOptionLabel={(opt) => `${opt.label} (Runs: ${opt.runCount})`}
              />
              {editingSystemPrompt && (
                <button
                  type="button"
                  className="text-xs text-red-600 underline"
                  onClick={() =>
                    handleRemoveSystemPrompt(
                      selectedTest.id,
                      editingSystemPrompt.systemPromptHash
                    )
                  }
                >
                  Remove this system prompt result
                </button>
              )}
            </div>
          )}
          <div>
            <Controller
              name="models"
              control={control}
              rules={{ required: "At least one model must be selected" }}
              render={({ field: { onChange, value } }) => (
                <div className="space-y-2">
                  <label
                    htmlFor="models-select"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Models to Test
                  </label>
                  <Select
                    isMulti
                    id="models-select"
                    value={allModels
                      .filter((model) => value?.includes(model.id))
                      .map((module) => ({
                        value: module.id,
                        label: module.id.split("/")[1] || module.id,
                        group: module.id.split("/")[0],
                      }))}
                    onChange={(newValue) => {
                      onChange(newValue?.map((item) => item.value));
                    }}
                    options={allModels
                      .map((model) => ({
                        value: model.id,
                        label: model.name,
                        group: model.id.split("/")[0],
                      }))
                      .reduce((groups, item) => {
                        const group = groups.find(
                          (g) => g.label === item.group
                        );
                        if (group) {
                          group.options.push(item);
                        } else {
                          groups.push({
                            label: item.group,
                            options: [item],
                          });
                        }
                        return groups;
                      }, [] as { label: string; options: any[] }[])}
                    classNames={{
                      control: (state) =>
                        `!bg-white !z-20 !border-slate-300 hover:!border-slate-400 ${
                          state.isFocused
                            ? "!border-blue-500 !shadow-sm !ring-1 !ring-blue-500"
                            : ""
                        }`,
                      option: (state) =>
                        `!text-slate-700 !z-20 ${
                          state.isFocused ? "!bg-slate-100" : ""
                        } ${
                          state.isSelected ? "!bg-blue-500 !text-white" : ""
                        }`,
                      multiValue: () => "!bg-blue-100 !z-20",
                      multiValueLabel: () => "!text-blue-800 !z-20",
                      multiValueRemove: () =>
                        "!text-blue-500 hover:!bg-blue-200 hover:!text-blue-600 !z-20",
                      group: () =>
                        "!text-sm !z-20 !text-slate-500 !px-3 !py-2 !bg-slate-50",
                      groupHeading: () =>
                        "!text-xs !font-semibold !uppercase !tracking-wider",
                    }}
                    placeholder="Search and select models..."
                    noOptionsMessage={() => "No models found"}
                    isSearchable
                    isClearable
                    closeMenuOnSelect={false}
                    menuPlacement="auto"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Search and select multiple models from the list
                  </p>
                  {errors.models && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.models.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Zod Schema Definition
            </label>
            <Controller
              name="schema"
              control={control}
              rules={{
                required: "Schema is required",
              }}
              render={({
                field: { value, onChange, onBlur },
                fieldState: { error },
              }) => (
                <>
                  <SchemaEditor
                    value={value}
                    onChange={onChange}
                    error={error?.message || schemaError || undefined}
                    disabled={!isCreateMode && isEditingExistingTest}
                    height={!isCreateMode ? "80px" : "200px"}
                  />
                  {error?.message && (
                    <p className="mt-1 text-sm text-red-600">{error.message}</p>
                  )}
                  {schemaError && !error?.message && (
                    <p className="mt-1 text-sm text-red-600">{schemaError}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Note: The schema cannot be changed for this test after
                    creation.
                  </p>
                </>
              )}
            />
          </div>
          <div>
            <label
              htmlFor="systemPrompt"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              System Prompt
            </label>
            <textarea
              id="systemPrompt"
              {...register("systemPrompt", {
                required: "System prompt is required",
              })}
              rows={3}
              className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-md text-black ${
                errors.systemPrompt ? "border-red-500" : ""
              }`}
              aria-invalid={errors.systemPrompt ? "true" : "false"}
            />
            {errors.systemPrompt && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.systemPrompt.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="userPrompt"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              User Prompt
            </label>
            <textarea
              id="userPrompt"
              {...register("userPrompt", {
                required: "User prompt is required",
              })}
              rows={!isCreateMode ? 1 : 3}
              className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-md text-black ${
                errors.userPrompt ? "border-red-500" : ""
              }`}
              aria-invalid={errors.userPrompt ? "true" : "false"}
              disabled={!isCreateMode && isEditingExistingTest}
            />
            {errors.userPrompt && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.userPrompt.message}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Note: The user prompt cannot be changed for this test after
              creation.
            </p>
          </div>
          <div>
            <label
              htmlFor="callTimes"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Number of Calls Per Model
            </label>
            <input
              id="callTimes"
              type="number"
              min={1}
              max={20}
              {...register("callTimes", {
                required: "Number of calls is required",
                valueAsNumber: true,
                min: { value: 1, message: "Minimum calls is 1" },
                max: { value: 20, message: "Maximum calls is 20" },
              })}
              className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 text-md text-black ${
                errors.callTimes ? "border-red-500" : ""
              }`}
              aria-invalid={errors.callTimes ? "true" : "false"}
            />
            {errors.callTimes && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.callTimes.message}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end px-4 pb-4 flex-shrink-0">
        <button
          type="submit"
          disabled={isLoading || !!schemaError}
          className={`flex px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors duration-150 ease-in-out
             ${
               isLoading || !!schemaError
                 ? "bg-blue-300 cursor-not-allowed"
                 : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
             }`}
        >
          <Play className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Running..." : "Run Test"}
        </button>
      </div>
    </form>
  );
};

export default StressTestForm;
