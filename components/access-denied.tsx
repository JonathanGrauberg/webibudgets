export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="p-6 rounded-lg border bg-red-50 max-w-md text-center">
        <p className="text-red-800 font-medium">
          {message ?? 'No tienes permisos para ver esta página.'}
        </p>
      </div>
    </div>
  )
}
