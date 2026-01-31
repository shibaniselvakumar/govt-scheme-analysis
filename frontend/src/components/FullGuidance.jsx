import { useEffect } from 'react';

function FullGuidance({ guidanceData = [] }) {

  useEffect(() => {
    console.log('[GUIDANCE_PAGE_LOADED]');
    console.log('[GUIDANCE_DATA_FROM_PROPS]', guidanceData);
  }, [guidanceData]);

  if (!guidanceData.length) {
    return (
      <div className="p-6 text-center text-red-600">
        No guidance data available.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {guidanceData.map(item => (
        <div key={item.scheme_id} className="card">
          <h2 className="text-xl font-semibold mb-3">
            {item.scheme_name}
          </h2>

          <div className="bg-gray-100 p-4 rounded text-sm space-y-2">
            <p><strong>Pre-Application</strong></p>
            <pre>{JSON.stringify(item.guidance.pre_application, null, 2)}</pre>

            <p><strong>Application Steps</strong></p>
            <pre>{JSON.stringify(item.guidance.application_steps, null, 2)}</pre>

            <p><strong>Missing Documents</strong></p>
            <pre>{JSON.stringify(item.guidance.missing_documents, null, 2)}</pre>

            <p><strong>Post Application</strong></p>
            <pre>{JSON.stringify(item.guidance.post_application, null, 2)}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FullGuidance;
