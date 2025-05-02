import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import SchemaEditor from './SchemaEditor';
import { AlertTriangle, Play } from 'lucide-react';
import { allModels } from './models';
import Select from 'react-select';

interface FormData {
  models: string[];
  schema: string;
  systemPrompt: string;
  userPrompt: string;
  callTimes: number;
}

interface StressTestFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}



const StressTestForm: React.FC<StressTestFormProps> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, control } = useForm<FormData>({
    defaultValues: {
      // Ensure default models exist in the allModelIds list
      models: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
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
      systemPrompt: 'You are an AI assistant designed to output structured JSON data based on the provided schema. Respond only with the valid JSON object.',
      userPrompt: 'Generate realistic information for a fictional person including their name, age, student status, interests, and address (street and city).',
      callTimes: 1
    }
  });
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const handleFormSubmit = (data: FormData) => {
    try {
      setSchemaError(null);
      onSubmit(data);
    } catch (e: any) {
      setSchemaError(`Invalid JSON Schema: ${e.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white rounded-lg shadow">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {/* Models Selection */}
          <div>
            <Controller
              name="models"
              control={control}
              rules={{ required: 'At least one model must be selected' }}
              render={({ field: { onChange, value } }) => (
                <div className="space-y-2">
                  <label htmlFor="models-select" className="block text-sm font-medium text-slate-700">
                    Models to Test
                  </label>
                  <Select
                    isMulti
                    id="models-select"
                    value={allModels
                      .filter(modelId => value?.includes(modelId))
                      .map(modelId => ({
                        value: modelId,
                        label: modelId.split('/')[1] || modelId,
                        group: modelId.split('/')[0]
                      }))
                    }
                    onChange={(newValue) => {
                      onChange(newValue?.map(item => item.value));
                    }}
                    options={allModels.map(modelId => ({
                      value: modelId,
                      label: modelId.split('/')[1] || modelId,
                      group: modelId.split('/')[0]
                    })).reduce((groups, item) => {
                      const group = groups.find(g => g.label === item.group);
                      if (group) {
                        group.options.push(item);
                      } else {
                        groups.push({
                          label: item.group,
                          options: [item]
                        });
                      }
                      return groups;
                    }, [] as { label: string, options: any[] }[])}
                    classNames={{
                      control: (state) => 
                        `!bg-white !border-slate-300 hover:!border-slate-400 ${state.isFocused ? '!border-blue-500 !shadow-sm !ring-1 !ring-blue-500' : ''}`,
                      option: (state) =>
                        `!text-slate-700 ${state.isFocused ? '!bg-slate-100' : ''} ${state.isSelected ? '!bg-blue-500 !text-white' : ''}`,
                      multiValue: () => '!bg-blue-100',
                      multiValueLabel: () => '!text-blue-800',
                      multiValueRemove: () => '!text-blue-500 hover:!bg-blue-200 hover:!text-blue-600',
                      group: () => '!text-sm !text-slate-500 !px-3 !py-2 !bg-slate-50',
                      groupHeading: () => '!text-xs !font-semibold !uppercase !tracking-wider'
                    }}
                    placeholder="Search and select models..."
                    noOptionsMessage={() => "No models found"}
                    isSearchable
                    isClearable
                    closeMenuOnSelect={false}
                    menuPlacement="auto"
                  />
                  <p className="mt-1 text-xs text-slate-500">Search and select multiple models from the list</p>
                  {errors.models && (
                    <p className="mt-1 text-sm text-red-600">{errors.models.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Schema Definition */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Zod Schema Definition
            </label>
            <Controller
              name="schema"
              control={control}
              rules={{
                required: 'Schema is required',
              }}
              render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
                <>
                  <SchemaEditor
                    value={value}
                    onChange={onChange}
                    error={error?.message || schemaError || undefined}
                  />
                  {error?.message && (
                    <p className="mt-1 text-sm text-red-600">{error.message}</p>
                  )}
                  {schemaError && !error?.message && (
                    <p className="mt-1 text-sm text-red-600">{schemaError}</p>
                  )}
                </>
              )}
            />
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-slate-700 mb-1">
              System Prompt
            </label>
            <textarea
              id="systemPrompt"
              {...register('systemPrompt', { required: 'System prompt is required' })}
              rows={3}
              className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black ${errors.systemPrompt ? 'border-red-500' : ''}`}
              aria-invalid={errors.systemPrompt ? "true" : "false"}
            />
            {errors.systemPrompt && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.systemPrompt.message}</p>
            )}
          </div>

          {/* User Prompt */}
          <div>
            <label htmlFor="userPrompt" className="block text-sm font-medium text-slate-700 mb-1">
              User Prompt
            </label>
            <textarea
              id="userPrompt"
              {...register('userPrompt', { required: 'User prompt is required' })}
              rows={3}
              className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black ${errors.userPrompt ? 'border-red-500' : ''}`}
              aria-invalid={errors.userPrompt ? "true" : "false"}
            />
            {errors.userPrompt && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.userPrompt.message}</p>
            )}
          </div>

          {/* Call Times */}
          <div>
            <label htmlFor="callTimes" className="block text-sm font-medium text-slate-700 mb-1">
              Number of Calls Per Model
            </label>
            <input
              id="callTimes"
              type="number"
              min={1}
              max={20}
              {...register('callTimes', {
                required: 'Number of calls is required',
                valueAsNumber: true,
                min: { value: 1, message: 'Minimum calls is 1' },
                max: { value: 20, message: 'Maximum calls is 20' }
              })}
              className={`block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-black ${errors.callTimes ? 'border-red-500' : ''}`}
              aria-invalid={errors.callTimes ? "true" : "false"}
            />
            {errors.callTimes && (
              <p className="mt-1 text-sm text-red-600" role="alert">{errors.callTimes.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500 flex items-center">
            <AlertTriangle className="inline-block h-4 w-4 mr-1 flex-shrink-0" />
            <span>Tests may incur costs and take time to complete. Max calls per model: 20.</span>
          </div>
          <button
            type="submit"
            disabled={isLoading || !!schemaError}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors duration-150 ease-in-out
             ${isLoading || !!schemaError
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
          >
            <Play className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Running...' : 'Run Test'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default StressTestForm;
