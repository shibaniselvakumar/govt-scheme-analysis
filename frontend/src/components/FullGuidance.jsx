import { useEffect } from 'react';

function FullGuidance({ guidanceData = [] }) {

  useEffect(() => {
    console.log('[GUIDANCE_PAGE_LOADED]');
    console.log('[GUIDANCE_DATA_FROM_PROPS]', guidanceData);
  }, [guidanceData]);

  if (!guidanceData.length) {
    return (
      <div className="p-10 text-center text-red-600 text-lg font-semibold">
        No guidance data available.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      {guidanceData.map(item => (
        <div
          key={item.scheme_id}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
            <h2 className="text-2xl font-bold">
              {item.scheme_name}
            </h2>
            <p className="mt-1 text-sm opacity-90">
              Scheme ID: {item.scheme_id}
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-8">

            <GuidanceSection
              title="Pre-Application Checklist"
              description="Things you must verify and prepare before starting your application."
              data={item.guidance.pre_application}
              accent="blue"
            />

            <GuidanceSection
              title="Application Process"
              description="Step-by-step instructions to successfully apply for the scheme."
              data={item.guidance.application_steps}
              accent="green"
            />

            <GuidanceSection
              title="Missing Documents"
              description="Documents that are commonly missing or required during verification."
              data={item.guidance.missing_documents}
              accent="red"
            />

            <GuidanceSection
              title="Post-Application Guidance"
              description="What to do after submitting your application."
              data={item.guidance.post_application}
              accent="purple"
            />

          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Reusable Section Component ---------- */

function GuidanceSection({ title, description, data = [], accent }) {
  const accentMap = {
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    red: 'border-red-500 bg-red-50',
    purple: 'border-purple-500 bg-purple-50',
  };

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          {title}
        </h3>
        <p className="text-sm text-gray-500">
          {description}
        </p>
      </div>

      <div className="space-y-3">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${accentMap[accent]}`}
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border flex items-center justify-center text-sm font-bold text-gray-700">
                {index + 1}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {step}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 italic">
            No information available.
          </p>
        )}
      </div>
    </div>
  );
}

export default FullGuidance;
