import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import SchemaEditor from './SchemaEditor';
import { AlertTriangle, Play } from 'lucide-react';

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

const availableModels = [
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'openai/gpt-4', name: 'GPT-4' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'google/gemini-pro', name: 'Gemini Pro' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B Instruct' },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B Instruct' },
];

const StressTestForm: React.FC<StressTestFormProps> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, control } = useForm<FormData>({
    defaultValues: {
      models: ['openai/gpt-4-turbo', 'anthropic/claude-3-sonnet'],
      schema: `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" },
    "isStudent": { "type": "boolean" },
    "interests": { 
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["name", "age"]
}`,
      systemPrompt: 'You are a helpful assistant that provides information in a structured format.',
      userPrompt: 'Generate information about a fictional person with their name, age, student status, and interests.',
      callTimes: 5
    }
  });
  
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const handleFormSubmit = (data: FormData) => {
    try {
      // Basic validation that the schema is valid JSON
      JSON.parse(data.schema);
      setSchemaError(null);
      onSubmit(data);
    } catch (err) {
      setSchemaError('Invalid JSON schema');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Test Configuration</h2>
        
        <div className="space-y-6">
          {/* Models Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Models to Test
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-md">
              {availableModels.map((model) => (
                <div key={model.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`model-${model.id}`}
                    value={model.id}
                    {...register('models', { 
                      required: 'Select at least one model',
                    })}
                    className="h-4 w-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor={`model-${model.id}`} className="ml-2 text-sm text-slate-700">
                    {model.name}
                  </label>
                </div>
              ))}
            </div>
            {errors.models && (
              <p className="mt-1 text-sm text-red-600">{errors.models.message}</p>
            )}
          </div>

          {/* Schema Definition */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              JSON Schema Definition
            </label>
            <Controller
              name="schema"
              control={control}
              rules={{ required: 'Schema is required' }}
              render={({ field }) => (
                <SchemaEditor
                  value={field.value}
                  onChange={field.onChange}
                  error={schemaError || (errors.schema?.message as string)}
                />
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
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
            {errors.systemPrompt && (
              <p className="mt-1 text-sm text-red-600">{errors.systemPrompt.message}</p>
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
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
            {errors.userPrompt && (
              <p className="mt-1 text-sm text-red-600">{errors.userPrompt.message}</p>
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
                min: { value: 1, message: 'Minimum calls is 1' },
                max: { value: 20, message: 'Maximum calls is 20' }
              })}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            />
            {errors.callTimes && (
              <p className="mt-1 text-sm text-red-600">{errors.callTimes.message}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            <AlertTriangle className="inline-block h-4 w-4 mr-1" />
            Tests may take time to complete
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white
             ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? 'Running...' : 'Run Test'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default StressTestForm;